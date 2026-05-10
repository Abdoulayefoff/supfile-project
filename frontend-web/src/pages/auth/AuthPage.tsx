import { useState, type ReactElement } from 'react';
import { LoginForm }    from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { LegalModal }   from '@/components/ui/LegalModal';
import type { LegalSlug } from '@/services/legalService';
import { useIsMobile }  from '@/hooks/useIsMobile';

// Mode actif sur la page auth
type AuthMode = 'login' | 'register';

export const AuthPage = (): ReactElement => {
    const isMobile = useIsMobile();

    // Contrôle quel formulaire est affiché (login ou register)
    const [mode, setMode] = useState<AuthMode>('login');

    // Slug du document légal à afficher (null = modal fermée)
    const [legalSlug, setLegalSlug] = useState<LegalSlug | null>(null);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f0f2f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            gap: '24px',
            position: 'relative',
        }}>

            {/* ── Blob décoratif haut-gauche ── */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
                opacity: 0.35,
                pointerEvents: 'none',
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-8%',
                    left: '-4%',
                    width: '35%',
                    height: '35%',
                    background: 'rgba(0,91,191,.07)',
                    filter: 'blur(100px)',
                    borderRadius: '50%',
                }} />

                {/* ── Blob décoratif bas-droit ── */}
                <div style={{
                    position: 'absolute',
                    bottom: '-8%',
                    right: '-4%',
                    width: '35%',
                    height: '35%',
                    background: 'rgba(71,94,140,.07)',
                    filter: 'blur(100px)',
                    borderRadius: '50%',
                }} />
            </div>

            {/* ── Logo Supfile ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 10,
            }}>
                {/* Container icône avec gradient */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #005bbf, #1a73e8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '22px', color: 'white', fontVariationSettings: "'FILL' 1" }}
                    >
                        cloud
                    </span>
                </div>

                {/* Nom de l'application */}
                <span style={{
                    fontSize: '22px',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: '#005bbf',
                }}>
                    Supfile
                </span>
            </div>

            {/* ── Carte principale (deux panneaux) ── */}
            <div className="fade" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '940px',
                background: 'rgba(255,255,255,.88)',
                backdropFilter: 'blur(24px)',
                borderRadius: isMobile ? '24px' : '40px',
                boxShadow: '0 12px 40px rgba(0,91,191,.10)',
                overflow: 'hidden',
                display: 'flex',
                zIndex: 10,
            }}>

                {/* ── Panneau gauche (décoratif) — masqué sur mobile ── */}
                <div style={{
                    flex: '0 0 44%',
                    background: 'linear-gradient(145deg, #1255b8, #1976d2 50%, #2094f3)',
                    padding: '64px 52px',
                    display: isMobile ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    color: 'white',
                    textAlign: 'center',
                }}>
                    {/* Blob interne haut-droit */}
                    <div style={{
                        position: 'absolute',
                        top: '-15%',
                        right: '-15%',
                        width: '300px',
                        height: '300px',
                        background: 'rgba(255,255,255,.10)',
                        filter: 'blur(48px)',
                        borderRadius: '50%',
                    }} />

                    {/* Blob interne bas-gauche */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-10%',
                        left: '-10%',
                        width: '220px',
                        height: '220px',
                        background: 'rgba(255,255,255,.06)',
                        filter: 'blur(36px)',
                        borderRadius: '50%',
                    }} />

                    {/* Contenu du panneau gauche */}
                    <div style={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '28px',
                    }}>
                        {/* Icône principale animée */}
                        <span
                            className="material-symbols-outlined float"
                            style={{
                                fontSize: '108px',
                                color: 'white',
                                fontVariationSettings: "'FILL' 1",
                            }}
                        >
                            folder_shared
                        </span>

                        {/* Titre */}
                        <h2 style={{
                            fontSize: '26px',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                        }}>
                            Gestion intelligente
                        </h2>

                        {/* Description */}
                        <p style={{
                            fontSize: '15px',
                            color: 'rgba(255,255,255,.78)',
                            lineHeight: 1.65,
                            maxWidth: '260px',
                            margin: '0 auto',
                        }}>
                            Stockez, organisez et partagez vos fichiers en toute sécurité depuis n'importe où.
                        </p>
                    </div>
                </div>

                {/* ── Panneau droit (formulaires) ── */}
                <div style={{
                    flex: 1,
                    padding: isMobile ? '32px 20px' : '52px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    justifyContent: 'center',
                }}>
                    {/* Affiche le formulaire selon le mode actif */}
                    {mode === 'login' ? (
                        <LoginForm onSwitchMode={() => setMode('register')} />
                    ) : (
                        <RegisterForm onSwitchMode={() => setMode('login')} />
                    )}
                </div>
            </div>

            {/* ── Footer ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 10 }}>
                <span style={{ fontSize: '11px', color: '#727785' }}>
                    © {new Date().getFullYear()} Supfile SUPINFO — Tous droits réservés
                </span>
                <div style={{ display: 'flex', gap: '28px' }}>
                    {([
                        { slug: 'privacy' as LegalSlug, label: 'Confidentialité' },
                        { slug: 'terms'   as LegalSlug, label: 'Conditions'      },
                        { slug: 'help'    as LegalSlug, label: 'Aide'            },
                    ]).map(({ slug, label }) => (
                        <button
                            key={slug}
                            type="button"
                            onClick={() => setLegalSlug(slug)}
                            style={{
                                fontSize:       '11px',
                                fontWeight:     700,
                                textTransform:  'uppercase',
                                letterSpacing:  '.10em',
                                color:          '#414754',
                                background:     'none',
                                border:         'none',
                                cursor:         'pointer',
                                fontFamily:     'Inter, sans-serif',
                                padding:        0,
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Modal légale (montée uniquement si un slug est sélectionné) ── */}
            {legalSlug && (
                <LegalModal slug={legalSlug} onClose={() => setLegalSlug(null)} />
            )}
        </div>
    );
};