import os
import pytest
from backend.services.encryption_service import EncryptionService


class TestEncryptionService:
    """Tests for the EncryptionService"""

    def test_encrypt_decrypt(self):
        """Test basic encrypt and decrypt"""
        os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

        plaintext = "my-password-123"
        encrypted = EncryptionService.encrypt(plaintext)

        # Encrypted text should be different from plaintext
        assert encrypted != plaintext
        assert len(encrypted) > 0

        # Decrypt should return original text
        decrypted = EncryptionService.decrypt(encrypted)
        assert decrypted == plaintext

    def test_encrypt_empty_string_raises_error(self):
        """Test that encrypting empty string raises ValueError"""
        os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

        with pytest.raises(ValueError):
            EncryptionService.encrypt("")

    def test_decrypt_invalid_text_returns_none(self):
        """Test that decrypting invalid text returns None"""
        os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

        result = EncryptionService.decrypt("invalid-encrypted-text")
        assert result is None

    def test_decrypt_empty_string_returns_none(self):
        """Test that decrypting empty string returns None"""
        os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

        result = EncryptionService.decrypt("")
        assert result is None

    def test_encryption_with_different_keys(self):
        """Test that different keys produce different encrypted values"""
        plaintext = "my-password"

        os.environ["SECRET_KEY"] = "key1"
        encrypted1 = EncryptionService.encrypt(plaintext)

        os.environ["SECRET_KEY"] = "key2"
        encrypted2 = EncryptionService.encrypt(plaintext)

        # Different keys should produce different encrypted values
        assert encrypted1 != encrypted2

    def test_missing_secret_key_raises_error(self):
        """Test that missing SECRET_KEY raises ValueError"""
        # Remove SECRET_KEY if it exists
        if "SECRET_KEY" in os.environ:
            del os.environ["SECRET_KEY"]

        with pytest.raises(ValueError, match="SECRET_KEY environment variable is required"):
            EncryptionService.encrypt("test")

    def test_encrypt_special_characters(self):
        """Test encrypting passwords with special characters"""
        os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

        plaintext = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/"
        encrypted = EncryptionService.encrypt(plaintext)
        decrypted = EncryptionService.decrypt(encrypted)

        assert decrypted == plaintext

    def test_encrypt_unicode_characters(self):
        """Test encrypting passwords with unicode characters"""
        os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

        plaintext = "пароль密码🔒"
        encrypted = EncryptionService.encrypt(plaintext)
        decrypted = EncryptionService.decrypt(encrypted)

        assert decrypted == plaintext
