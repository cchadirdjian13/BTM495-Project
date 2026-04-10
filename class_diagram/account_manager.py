from client import Client
from barber import Barber


class AccountManager:
    """Handles registration and lookup of Client and Barber accounts."""

    def __init__(self):
        # Registry maps email -> User instance
        self._accounts: dict[str, object] = {}
        self._next_id: int = 1

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register(self, role: str, name: str, email: str, password: str, phone: str):
        """Create a new account for the given role ('client' or 'barber').

        Args:
            role:     'client' or 'barber' (case-insensitive).
            name:     Full name of the user.
            email:    Unique email address used as the account identifier.
            password: Plain-text password (hash in production).
            phone:    Contact phone number.

        Returns:
            The newly created Client or Barber instance.

        Raises:
            ValueError: If an account with that email already exists or the
                        role is unrecognised.
        """
        self._validate_no_duplicate(email)

        user_id = self._next_id
        self._next_id += 1

        role_lower = role.strip().lower()
        if role_lower == "client":
            account = Client(user_id, name, email, password, phone)
        elif role_lower == "barber":
            account = Barber(user_id, name, email, password, phone)
        else:
            raise ValueError(f"Unknown role '{role}'. Expected 'client' or 'barber'.")

        self._accounts[email.lower()] = account
        print(f"{role.capitalize()} account created for '{name}' (ID: {user_id}).")
        return account

    def get_account(self, email: str):
        """Retrieve an existing account by email.

        Raises:
            KeyError: If no account exists for that email.
        """
        key = email.strip().lower()
        if key not in self._accounts:
            raise KeyError(f"No account found for email '{email}'.")
        return self._accounts[key]

    def account_exists(self, email: str) -> bool:
        """Return True if an account is already registered for *email*."""
        return email.strip().lower() in self._accounts

    def delete_account(self, email: str) -> None:
        """Remove an account from the registry.

        Raises:
            KeyError: If no account exists for that email.
        """
        key = email.strip().lower()
        if key not in self._accounts:
            raise KeyError(f"No account found for email '{email}'.")
        removed = self._accounts.pop(key)
        print(f"Account for '{removed.name}' (ID: {removed.user_id}) has been deleted.")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _validate_no_duplicate(self, email: str) -> None:
        if self.account_exists(email):
            raise ValueError(f"An account with email '{email}' already exists.")
