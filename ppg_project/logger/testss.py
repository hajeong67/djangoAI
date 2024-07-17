import json

# JSON 데이터 문자열
json_data = '''
{
    "data": [
        {"unix_time": 1675315761673, "ppg_data": 2019866},
        {"unix_time": 1675315761712, "ppg_data": 2019966}
    ]
}
'''

# JSON 문자열을 리스트로 변환
data_list = json.loads(json_data)

# 변환된 리스트를 출력
print(data_list)

# 리스트 요소의 속성을 확인
for item in data_list:
    print(f"Unix Time: {item['unix_time']}, PPG Data: {item['ppg_data']}")
