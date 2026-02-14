# 🔒 Rapports Sécurité

Audits de sécurité, pentests et analyses de vulnérabilités du projet FLOWZ.

---

## 📁 Organisation

Les rapports de sécurité sont organisés par date et type:

```
security/
├── 2026-02-DD-pentest-results.md
├── 2026-02-DD-dependency-audit.md
└── README.md (ce fichier)
```

---

## 📋 Liste des Rapports

Aucun rapport de sécurité archivé pour le moment.

---

## 🎯 Créer un Nouveau Rapport Sécurité

### Audit OWASP Top 10

```bash
# Analyser avec flowz-review (inclut checklist OWASP)
claude /flowz-review
# Focus sur sécurité

# Copier le template
cp docs/reports/templates/audit-template.md \
   docs/reports/security/YYYY-MM-DD-owasp-audit.md
```

### Dependency Vulnerabilities

```bash
# Audit npm
npm audit --audit-level=moderate

# Audit avec Snyk (si disponible)
npx snyk test

# Documenter les résultats
```

### RLS Policies Audit (Supabase)

```bash
# Vérifier les policies
psql $DATABASE_URL -c "
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
"

# Documenter les gaps
```

---

## 🔍 Checklist OWASP Top 10 (2021)

### A01:2021 – Broken Access Control
- [ ] RLS policies activées sur toutes les tables
- [ ] tenant_id vérifié dans toutes les queries
- [ ] API routes protégées par auth middleware
- [ ] Pas de IDOR (Insecure Direct Object Reference)

### A02:2021 – Cryptographic Failures
- [ ] Passwords hachés (bcrypt/argon2)
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted at rest
- [ ] No hardcoded secrets

### A03:2021 – Injection
- [ ] SQL injection prevented (Supabase RLS + parametrized)
- [ ] XSS prevented (DOMPurify)
- [ ] Command injection prevented
- [ ] Template injection prevented

### A04:2021 – Insecure Design
- [ ] Threat modeling done
- [ ] Security patterns followed
- [ ] Defense in depth
- [ ] Secure defaults

### A05:2021 – Security Misconfiguration
- [ ] No default credentials
- [ ] Error messages don't leak info
- [ ] Security headers configured
- [ ] CORS properly configured

### A06:2021 – Vulnerable Components
- [ ] Dependencies up to date
- [ ] npm audit clean
- [ ] No known CVEs
- [ ] SBOM maintained

### A07:2021 – Identification Failures
- [ ] Multi-factor authentication available
- [ ] Strong password policy
- [ ] Session management secure
- [ ] Account enumeration prevented

### A08:2021 – Software/Data Integrity
- [ ] Code signing
- [ ] Integrity checks
- [ ] CI/CD security
- [ ] Supply chain security

### A09:2021 – Security Logging Failures
- [ ] Security events logged
- [ ] Logs tamper-proof
- [ ] Alerting configured
- [ ] Audit trail

### A10:2021 – SSRF
- [ ] URL validation
- [ ] Allowlist approach
- [ ] No user-controlled URLs
- [ ] Network segmentation

---

## 🛠️ Outils de Sécurité

### Automated Scanning
```bash
# npm audit
npm audit --audit-level=moderate

# Snyk
npx snyk test
npx snyk monitor

# OWASP ZAP (si applicable)
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000
```

### Manual Testing
```bash
# Burp Suite Community
# OWASP ZAP
# Browser DevTools
```

### Code Analysis
```bash
# ESLint security plugin
npm install --save-dev eslint-plugin-security

# Semgrep
docker run --rm -v "${PWD}:/src" returntocorp/semgrep semgrep --config=auto
```

---

## 🚨 Incident Response

### En cas de vulnérabilité découverte:

1. **Évaluer la sévérité** (CVSS score)
2. **Isoler le problème** (ne pas le publier)
3. **Développer un fix**
4. **Tester le fix**
5. **Déployer en urgence si critique**
6. **Documenter dans security/**
7. **Notifier les stakeholders**

---

## 🔗 Ressources

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

---

**⚠️ IMPORTANT:** Les rapports de sécurité contenant des vulnérabilités non patchées doivent être **confidentiels** et ne JAMAIS être commités dans le repo public.

---

**Dernière mise à jour:** 2026-02-14
