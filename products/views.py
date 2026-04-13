from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import ProductItem
from .serializers import ProductItemSerializer


class ProductItemListView(APIView):
    """
    GET /api/products/                → all active products
    GET /api/products/?category=makeup|skincare|collections → filtered by category
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = ProductItem.objects.filter(is_active=True)
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return Response(ProductItemSerializer(qs, many=True, context={'request': request}).data)


class ProductItemDetailView(APIView):
    """GET /api/products/<pk>/"""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            item = ProductItem.objects.get(pk=pk, is_active=True)
            return Response(ProductItemSerializer(item, context={'request': request}).data)
        except ProductItem.DoesNotExist:
            from rest_framework import status
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
