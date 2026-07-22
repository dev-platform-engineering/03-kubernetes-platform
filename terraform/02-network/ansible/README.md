ansible-vault create group_vars/vyos_routers/vault.yml
vault_vyos_ansible_password: "YourSecureAdminPasswordHere"

ansible-playbook -i inventory/hosts.ini playbooks/site.yml --ask-vault-pass