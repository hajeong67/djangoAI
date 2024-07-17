# class SendGroupConsumer: watch와 상호작용
# def connect: 연결 시 send_group에 장비 추가
# def disconnect: 연결 해제시 send_group 탈퇴
# def receive: ppg 및 acc 데이터 수신 시 receive_group에 있는 모든 유저에게 데이터 전송

# class ReceiveGroupConsumer: 웹 브라우저와 상호작용
# def connect: 연결 시 receive_group에 추가
# def disconnect: 연결 해제시 receive_group 탈퇴
# def sensor_data: SendGroupConsumer에서 송신한 데이터를 수신 시 웹 브라우저에 데이터 전송