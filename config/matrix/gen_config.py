import os

with open('/etc/synapse-config/homeserver.yaml.tpl') as f:
    content = f.read()

for key in ['MATRIX_DB_USER', 'MATRIX_DB_PASSWORD', 'MATRIX_REGISTRATION_SECRET',
            'MATRIX_MACAROON_SECRET_KEY', 'MATRIX_FORM_SECRET']:
    content = content.replace(f'${{{key}}}', os.environ[key])

with open('/data/homeserver.yaml', 'w') as f:
    f.write(content)

print('[entrypoint] homeserver.yaml generated from template')
