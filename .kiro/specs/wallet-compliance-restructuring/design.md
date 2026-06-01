## Wallet & Platform Compliance Restructuring - Design Document

## Overview

### Purpose
This design document outlines the technical architecture and implementation approach for restructuring the platform's wallet system, transaction processing, and related modules (Shop, Contest, Chama) to achieve regulatory compliance while maintaining core functionality.

### Business Context
The platform operates as a **platform currency provider** (not a money transmitter) offering Kr coin as a reward token for digital services. The restructuring eliminates high-risk features (direct wallet transfers, escrow, investment chamas) and adds comprehensive compliance controls (transaction context, risk scoring, KYC workflows).

### Key Design Principles
1. **Compliance by Design**: Every transaction must have business context
2. **Zero Budget Constraints**: Use free/open-source solutions where possible
3. **Global Operation**: Support users from any country with appropriate risk controls
4. **Minimal Disruption**: Maintain user experience while adding compliance layers
5. **Audit Trail**: Immutable logging of all financial activities

### Scope
**In Scope:**
- Platform currency (Kr) restructuring with fiat conversion display
- Transaction context requirements and validation
- Risk scoring and suspicious activity detection
- Removal of wallet-to-wallet transfers and direct chat tips
- Task-based locked chat access model
- Shop module restructuring (listing-only, no escrow)
- Contest module compliance (paid voting rules, prize pool management)
- Chama restructuring (remove investment type, add KYC requirements)
- Enhanced KYC workflows
- Compliance dashboard for manual review

**Out of Scope:**
- Multi-country money transmitter licensing
- SOC 2 / ISO 27001 certification
- Automated regulatory reporting
- Paid sanctions screening APIs
- PCI DSS compliance (handled by payment processors)
- Virtual gifts feature (not needed without livestreaming)

---

## Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile App]
        Web[Web App]
    end
    
    subgraph "API Gateway"
        Gateway[API Gateway + Rate Limiting]
    end
    
    subgraph "Application Layer"
        Auth[Auth Service]
        Wallet[Wallet Service]
        Transaction[Transaction Service]
        Risk[Risk Scoring Engine]
        KYC[KYC Service]
        Contest[Contest Service]
        Chama[Chama Service]
        Shop[Shop Service]
        Chat[Chat Service]
    end
    
    subgraph "Compliance Layer"
        Context[Context Validator]
        Velocity[Velocity Checker]
        Pattern[Pattern Detector]
        Sanctions[Sanctions Screener]
        Dashboard[Compliance Dashboard]
    end
    
    subgraph "External Services"
        Payment[Payment Processors<br/>Stripe/PayPal/M-Pesa]
        Currency[Currency API<br/>fawazahmed0]
        Device[Device Fingerprint<br/>FingerprintJS]
        OFAC[OFAC List<br/>treasury.gov]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
        Audit[(Audit Logs)]
    end
    
    Mobile --> Gateway
    Web --> Gateway
    Gateway --> Auth
    Gateway --> Wallet
    Gateway --> Transaction
    Gateway --> Contest
    Gateway --> Chama
    Gateway --> Shop
    Gateway --> Chat
    
    Transaction --> Context
    Transaction --> Velocity
    Transaction --> Risk
    
    Risk --> Pattern
    Risk --> Sanctions
    
    Wallet --> Currency
    Transaction --> Device
    
    Context --> DB
    Velocity --> Cache
    Risk --> DB
    Pattern --> DB
    Sanctions --> OFAC
    
    Transaction --> Audit
    Risk --> Audit
    KYC --> Audit
    
    Dashboard --> DB
    Dashboard --> Audit
    
    Wallet --> Payment
