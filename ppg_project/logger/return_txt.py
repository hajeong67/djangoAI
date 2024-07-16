import json

# 파일 경로 설정
file_path = '12sec.txt'


# 파일을 읽고 리스트로 변환하는 함수
def convert_file_to_json_list(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    data_list = []
    for line in lines:
        unix_time, ppg_data = map(int, line.strip().split())
        data_list.append({"unix_time": unix_time, "ppg_data": ppg_data})

    return data_list


# 함수 호출 및 결과 출력
data_list = convert_file_to_json_list(file_path)

# 리스트를 JSON 문자열로 변환하여 출력 (파일 저장도 가능)
json_data = json.dumps(data_list, indent=4)
print(json_data)

# JSON 문자열을 파일로 저장 (선택 사항)
with open('output.json', 'w') as json_file:
    json_file.write(json_data)

