
class read:
    def __init__(self, data, y,chunk_size, overlap):
        self.data=data
        self.chunk_size=chunk_size
        self.overlap=overlap
        self.y=y

    def read_txt_files_with_skip(self): #레이블 유무로 test와 train을 나누자.
        data_list = []
        for file_path in self.data:
            print(f"Reading file: {file_path}")
            file_data = []
            file_data.append(self.y)
            with open(file_path, 'r') as file:
                lines = file.readlines()
                for line in lines[15:-1]:
                    values = line.strip().split()
                    second_int = int(values[1])
                    file_data.append(second_int)
            data_list.append(file_data)
        return data_list
