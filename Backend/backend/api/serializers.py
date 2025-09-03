from django.contrib.auth import get_user_model
from rest_framework import serializers

# Get the currently active user model (important for custom user models)
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # These are the fields your API will accept for user registration.
        # 'id' is for output, 'username', 'email', 'first_name', 'last_name' are for input.
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']

        # This makes sure the password is only used for writing (creating/updating)
        # and is never sent back in API responses, which is a security best practice.
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # 1. Take the plain-text password out of the validated_data dictionary.
        #    This is crucial because User.objects.create_user() handles password hashing.
        password = validated_data.pop('password')

        # 2. Create the user.
        #    - 'password=password' passes the extracted password to the hashing function.
        #    - '**validated_data' unpacks the rest of the data (username, email, first_name, last_name)
        #      and assigns them to the new User object.
        user = User.objects.create_user(password=password, **validated_data)

        return user

