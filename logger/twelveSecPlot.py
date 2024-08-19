import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

class PeakPredictor:
    def __init__(self, model_path, peaks):
        self.model = tf.keras.models.load_model(model_path)
        self.peaks = peaks

    def predict_peaks(self):
        predictions = []
        for peak in self.peaks:
            if not np.all(peak == -1):
                p = np.array(peak)
                pred = self.model.predict(p.reshape(1, -1))
                predictions.append(pred[0][0])
            else:
                predictions.append(-1)

        print(f"Predictions: {predictions}")  # 예측 결과 확인

        count_ones = len([x for x in predictions if x > 0.73])
        count_zeros = len([x for x in predictions if 0 <= x <= 0.73])
        count_neg_ones = len([x for x in predictions if x == -1])

        print(f"Count Ones: {count_ones}, Count Zeros: {count_zeros}, Count Neg Ones: {count_neg_ones}")

        l = count_ones + count_zeros + count_neg_ones

        if count_neg_ones / l >= 0.8:
            state = -1
        else:
            if count_ones / (count_ones + count_zeros) >= 0.3:
                state = 1
            else:
                state = 0

        print(f"Final State: {state}")  # 최종 state 확인

        return predictions, state