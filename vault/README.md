# Vault Configuration

## Architecture

HashiCorp Vault runs externally to the Kubernetes cluster.

- Deployment: 3-node HA cluster
- Storage: Integrated Raft
- Authentication: Kubernetes auth method
- Secrets engine: KV v2
- Vault endpoint: `https://vault.infra.platform.internal:8200`

## Repository Structure

```text
vault/
├── README.md
├── policies/
│   └── eso-platform-read.hcl
├── auth/
│   └── kubernetes/
└── secrets-engines/
```

## Secrets Engines

| Mount | Type | Purpose |
|---|---|---|
| `lab/` | KV v2 | Lab and experimental secrets |
| `platform/` | KV v2 | Platform service credentials |

## Access Policies

| Policy | Purpose |
|---|---|
| `eso-platform-read` | Read Redis credentials for External Secrets Operator |

## Security

- Never commit secret values, Vault tokens, JWTs, or private keys.
- Vault remains external to Kubernetes.
- Use dedicated Kubernetes authentication roles.
- Apply least-privilege access policies.
- Manage Vault configuration manually initially; migrate to Ansible when appropriate.
