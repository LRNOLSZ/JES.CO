from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UserSerializer


class MeView(RetrieveUpdateAPIView):
    """
    GET  /api/accounts/me/  — return the authenticated user's profile.
    PATCH /api/accounts/me/ — update allowed fields (first_name, last_name, email).
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user
