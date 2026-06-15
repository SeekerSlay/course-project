from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """Только администратор может создавать/изменять товары и категории."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsAuthorOrReadOnly(permissions.BasePermission):
    """Редактировать отзыв может только его автор."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user
