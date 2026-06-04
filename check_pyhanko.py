import pyhanko.sign.signers
print("Attributes in pyhanko.sign.signers:")
print(dir(pyhanko.sign.signers))

try:
    from pyhanko.sign.signers import SimpleSigner
    print("\nSimpleSigner found.")
    if hasattr(SimpleSigner, 'load_pkcs12'):
        print("SimpleSigner has load_pkcs12")
    else:
        print("SimpleSigner does NOT have load_pkcs12")
except ImportError:
    print("\nSimpleSigner NOT found.")
