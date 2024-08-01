from rest_framework import serializers


class DataItemSerializer(serializers.Serializer):
    time = serializers.IntegerField()
    uuid = serializers.CharField()
    ppg = serializers.ListField(
        child=serializers.FloatField()
    )
    acc = serializers.ListField(
        child=serializers.ListField(
            child=serializers.FloatField()
        )
    )


class PPGDataSerializer(serializers.Serializer):
    data = serializers.ListField(
        child=DataItemSerializer()
    )
