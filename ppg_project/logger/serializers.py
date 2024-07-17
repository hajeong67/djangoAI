from rest_framework import serializers


class PPGDataItemSerializer(serializers.Serializer):
    unix_time = serializers.IntegerField()
    ppg_data = serializers.IntegerField()


class PPGDataSerializer(serializers.Serializer):
    data = serializers.ListField(
        child=PPGDataItemSerializer()
    )
