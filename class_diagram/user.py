from abc import ABC, abstractmethod


class User(ABC):
    def __init__(self, user_id, name, email, password, phone):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.password = password
        self.phone = phone

    @abstractmethod
    def login(self):
        pass

    @abstractmethod
    def logout(self):
        pass

    def update_profile(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
