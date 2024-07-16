import os
import sys
import numpy as np
import glob
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .twelveSecFilter import preprocessing, GMM_model_twelve_sec
from .twelveSecPlot import PeakPredictor
from django.shortcuts import render
from django.http import JsonResponse
from .models import PPGData
from .serializers import PPGDataSerializer
import pickle
import joblib

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 로거 설정
logger = logging.getLogger('logger')

class PPGDataView(APIView):

    def post(self, request, *args, **kwargs):
        logger.debug("Received POST request with data: %s", request.data)
        serializer = PPGDataSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data['data']
            logger.debug("Serializer validated data: %s", data)
            chunk_size = 300
            overlap = 0

            try:
                # JSON 데이터를 리스트 형식으로 변환 (ppg_data만 추출)
                ppg_data_list = [item['ppg_data'] for item in data]
                test_data_list = [[1] + ppg_data_list]

                # 데이터 확인용
                logger.debug(f"DEBUG: test_data_list = {test_data_list[:5]}")

                # 기존 모델 및 리스트 파일 로드
                base_dir = os.path.dirname(os.path.abspath(__file__))
                gmm_n_path = os.path.join(base_dir, 'gmm_n_v3.pkl')
                gmm_p_path = os.path.join(base_dir, 'gmm_p_v3.pkl')
                list_pickle_path = os.path.join(base_dir, 'list_v3.pickle')

                try:
                    gmm_n_from_joblib = joblib.load(gmm_n_path)
                    logger.debug("gmm_n loaded successfully")

                    gmm_p_from_joblib = joblib.load(gmm_p_path)
                    logger.debug("gmm_p loaded successfully")

                    with open(list_pickle_path, "rb") as fi:
                        test = pickle.load(fi)
                    logger.debug("list.pickle loaded successfully")

                    lab0_f = test[0]
                    lab1_f = test[1]
                    m_f = test[2]
                    n_f = test[3]

                except Exception as e:
                    logger.error(f"Error loading files: {e}")
                    raise

                model_path = os.path.join(base_dir, "best_model.h5")

                # test data 전처리
                test_filtered = preprocessing(data=test_data_list, chunk_size=chunk_size, overlap=overlap)
                logger.debug(f"DEBUG: test_filtered = {test_filtered}")
                twelve_sec_filtered, twelve_sec_x, twelve_sec_y = test_filtered.dividing_and_extracting()

                if twelve_sec_filtered is None or twelve_sec_x is None or twelve_sec_y is None:
                    logger.error('Testing preprocessing failed, resulting in None data.')
                    return Response({'error': 'Testing preprocessing failed, resulting in None data.'},
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                logger.debug(f"Shape of twelve_sec_filtered: {np.array(twelve_sec_filtered).shape}")
                logger.debug(f"Shape of twelve_sec_x: {np.array(twelve_sec_x).shape}")
                logger.debug(f"Shape of twelve_sec_y: {np.array(twelve_sec_y).shape}")

                model_for_twelve_sec = GMM_model_twelve_sec(twelve_sec_filtered, gmm_p_from_joblib, gmm_n_from_joblib,
                                                            lab0_f, lab1_f, m_f, n_f)
                x_test_twelve_sec, y_test_twelve_sec = model_for_twelve_sec.GMM_model()
                logger.debug(f"Shape of x_test_twelve_sec after GMM_model: {np.array(x_test_twelve_sec).shape}")
                logger.debug(f"Shape of y_test_twelve_sec after GMM_model: {np.array(y_test_twelve_sec).shape}")

                if x_test_twelve_sec is None or y_test_twelve_sec is None:
                    logger.error('Modeling failed, resulting in None data.')
                    return Response({'error': 'Modeling failed, resulting in None data.'},
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                logger.debug(f"Shape of x_test_twelve_sec: {np.array(x_test_twelve_sec).shape}")
                logger.debug(f"Shape of y_test_twelve_sec: {np.array(y_test_twelve_sec).shape}")

                # 예측 수행
                predictor = PeakPredictor(model_path, x_test_twelve_sec)
                y_test_twelve_sec = predictor.plot_peaks()

                if not y_test_twelve_sec:
                    logger.error('Prediction resulted in empty data.')
                    return Response({'error': 'Prediction resulted in empty data.'},
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # x_test_twelve_sec, y_test_twelve_sec를 반환 위해 저장
                y_test_twelve_sec = [float(pred) for pred in y_test_twelve_sec]
                request.session['ppg_data_storage'] = x_test_twelve_sec.tolist()
                request.session['prediction_results'] = y_test_twelve_sec
                logger.debug(f"Stored normalized ppg_data in session: {request.session['ppg_data_storage']}")

                return Response({'predictions': y_test_twelve_sec}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Exception: {str(e)}")
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        logger.error("Invalid data: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, *args, **kwargs):
        # 저장된 ppg 데이터와 예측 결과를 반환
        ppg_data_storage = request.session.get('ppg_data_storage', [])
        prediction_results = request.session.get('prediction_results', [])
        logger.debug(
            f"GET request received. Returning stored ppg_data: {ppg_data_storage} and predictions: {prediction_results}")
        return Response({'ppg_data': ppg_data_storage, 'predictions': prediction_results}, status=status.HTTP_200_OK)


def chart_view(request):
    return render(request, 'chart.html')
