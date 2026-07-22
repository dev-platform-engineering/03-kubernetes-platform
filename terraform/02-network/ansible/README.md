ansible-vault create group_vars/vyos_routers/vault.yml
vault_vyos_ansible_password: "YourSecureAdminPasswordHere"

ansible-playbook -i inventory/host.ini --ask-vault-pass playbooks/site.yml