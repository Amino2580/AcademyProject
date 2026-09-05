from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny

from .models import RegistrationRequest
from .serializers import RegistrationRequestCreateSerializer


class RegistrationRequestCreateView(CreateAPIView):
    queryset = RegistrationRequest.objects.all()
    serializer_class = RegistrationRequestCreateSerializer
    permission_classes = [AllowAny]