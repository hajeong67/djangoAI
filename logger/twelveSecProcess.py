import pickle
import joblib
import CNN_model
import glob
import filter
import twelveSecFilter
import twelveSecPlot
import read
import test_plot
import heartpy as hp
import matplotlib.pyplot as plt
import tensorflow as tf

chunk_size=300
overlap=0

file_positive_green = glob.glob(r"P\green\*.txt")
file_negative_green=glob.glob(r"N\green\*.txt")
model_path="best_model_v6.h5"
twelveSec=glob.glob("12sec.txt")


train_positive_reader=read.read(data=file_positive_green, y=0, chunk_size=chunk_size, overlap=overlap)
train_negative_reader=read.read(data=file_negative_green, y=1, chunk_size=chunk_size, overlap=overlap)
p_train_list=train_positive_reader.read_txt_files_with_skip()
n_train_list=train_negative_reader.read_txt_files_with_skip()
train_list=p_train_list+n_train_list

gmm_n_from_joblib = joblib.load('gmm_n_v2.pkl')
gmm_p_from_joblib = joblib.load('gmm_p_v2.pkl')

with open("list_v2.pickle","rb") as fi:
    test = pickle.load(fi)
lab0_f = test[0]
lab1_f = test[1]
m_f = test[2]
n_f = test[3]

#train_filtered=filter.preprocessing(data=train_list, chunk_size=chunk_size,train_or_test="train", overlap=overlap)
#x_train, x_test, y_train, y_test, gmm_p, gmm_n, lab0, lab1, m, n = train_filtered.GMM_model(tot="train")
#training=CNN_model.model(x_train, x_test, y_train, y_test)
#history, predictions, score=training.build_model()

test_data=read.read(twelveSec, 1, chunk_size=chunk_size, overlap=overlap)
test_data_list=test_data.read_txt_files_with_skip()
print(test_data_list)
test_filtered=twelveSecFilter.preprocessing(data=test_data_list, chunk_size=chunk_size,overlap=overlap)
twelve_sec_filtered, twelve_sec_x, twelve_sec_y=test_filtered.dividing_and_extracting()

model_for_twelve_sec=twelveSecFilter.GMM_model_twelve_sec(twelve_sec_filtered, gmm_p_from_joblib, gmm_n_from_joblib, lab0_f, lab1_f, m_f, n_f)
x_test_twelve_sec, y_test_twelve_sec = model_for_twelve_sec.GMM_model()
print(x_test_twelve_sec)
print(y_test_twelve_sec)

predictor=twelveSecPlot.PeakPredictor(model_path, x_test_twelve_sec)
y_test_twelve_sec=predictor.plot_peaks()
print(y_test_twelve_sec)

# 27개의 벡터로 이루어진 피크를 보려면 x_test_twelve_sec
# 이 피크들의 예측값을 보려면 y_test_twelve_sec
