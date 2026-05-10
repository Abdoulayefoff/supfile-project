// Modal d'affichage des documents légaux (Confidentialité, Conditions, Aide).
// Le contenu est récupéré depuis l'API : GET /api/legal/{slug}
// Aucun contenu hardcodé côté frontend

import type { ReactElement } from 'react';
import { useLegal }          from '@/hooks/useLegal';
import { MaterialIcon }      from '@/components/ui/MaterialIcon';
import type { LegalSlug }    from '@/services/legalService';
import { useIsMobile }       from '@/hooks/useIsMobile';

// Config des slugs
const SLUG_CONFIG: Record<LegalSlug, { label: string; icon: string }> = {
    privacy: { label: 'Politique de confidentialité', icon: 'shield'         },
    terms:   { label: "Conditions d'utilisation",     icon: 'gavel'          },
    help:    { label: "Centre d'aide",                 icon: 'help'           },
};

// Props
interface LegalModalProps {
    slug:    LegalSlug;
    onClose: () => void;
}

// Composant principal
export const LegalModal = ({ slug, onClose }: LegalModalProps): ReactElement => {
    const isMobile = useIsMobile();
    const { data, isLoading, isError } = useLegal(slug);
    const config = SLUG_CONFIG[slug];

    return (
        // ── Overlay ──
        <div
            onClick={onClose}
            style={{
                position:       'fixed',
                inset:          0,
                zIndex:         300,
                background:     'rgba(0,0,0,.50)',
                backdropFilter: 'blur(6px)',
                display:        'flex',
                alignItems:     isMobile ? 'flex-end' : 'center',
                justifyContent: 'center',
                padding:        isMobile ? '0' : '24px',
            }}
        >
            {/* ── Carte ── */}
            <div
                className="fade"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background:   '#ffffff',
                    borderRadius: isMobile ? '22px 22px 0 0' : '22px',
                    width:        '100%',
                    maxWidth:     '680px',
                    maxHeight:    isMobile ? '88vh' : '80vh',
                    display:      'flex',
                    flexDirection:'column',
                    boxShadow:    '0 24px 80px rgba(0,0,0,.18)',
                    border:       '1px solid rgba(193,198,214,.3)',
                }}
            >
                {/* ── Header (fixe) ── */}
                <div
                    style={{
                        display:        'flex',
                        justifyContent: 'space-between',
                        alignItems:     'center',
                        padding:        isMobile ? '16px 18px' : '22px 28px',
                        borderBottom:   '1px solid rgba(193,198,214,.3)',
                        flexShrink:     0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                            style={{
                                width:          '36px',
                                height:         '36px',
                                borderRadius:   '10px',
                                background:     'rgba(0,91,191,.10)',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                flexShrink:     0,
                            }}
                        >
                            <MaterialIcon n={config.icon} s={20} c="#005bbf" />
                        </div>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: '#191c1d' }}>
                            {config.label}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background:   'rgba(0,0,0,.06)',
                            border:       'none',
                            cursor:       'pointer',
                            padding:      '8px',
                            borderRadius: '9999px',
                            display:      'flex',
                            alignItems:   'center',
                            justifyContent: 'center',
                            flexShrink:   0,
                            minWidth:     '36px',
                            minHeight:    '36px',
                        }}
                    >
                        <MaterialIcon n="close" s={20} c="#414754" />
                    </button>
                </div>

                {/* ── Corps scrollable ── */}
                <div
                    style={{
                        overflowY: 'auto',
                        padding:   isMobile ? '16px 18px' : '28px',
                        flex:      1,
                    }}
                >
                    {isLoading && (
                        <div
                            style={{
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                gap:            '10px',
                                padding:        '40px 0',
                                color:          '#727785',
                                fontSize:       '14px',
                            }}
                        >
                            <MaterialIcon n="hourglass_empty" s={20} c="#727785" />
                            Chargement…
                        </div>
                    )}

                    {isError && (
                        <div
                            style={{
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                gap:            '10px',
                                padding:        '40px 0',
                                color:          '#ba1a1a',
                                fontSize:       '14px',
                            }}
                        >
                            <MaterialIcon n="error_outline" s={20} c="#ba1a1a" />
                            Impossible de charger le document.
                        </div>
                    )}

                    {data && (
                        <MarkdownContent content={data.content} />
                    )}
                </div>

                {/* ── Footer (fixe) ── */}
                <div
                    style={{
                        padding:        isMobile ? '12px 18px' : '16px 28px',
                        borderTop:      '1px solid rgba(193,198,214,.3)',
                        display:        'flex',
                        justifyContent: 'flex-end',
                        flexShrink:     0,
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                            border:       'none',
                            borderRadius: '9999px',
                            padding:      '9px 24px',
                            fontSize:     '14px',
                            fontWeight:   600,
                            color:        'white',
                            cursor:       'pointer',
                            fontFamily:   'Inter, sans-serif',
                            boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                        }}
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

// Sous-composant — rendu Markdown minimal (sans dépendance externe)
// Gère : titres H1/H2/H3, paragraphes, listes, gras, séparateurs 

const MarkdownContent = ({ content }: { content: string }): ReactElement => {
    const lines = content.split('\n');

    const elements = lines.map((line, i) => {
        // Titre H1
        if (line.startsWith('# ')) {
            return (
                <h1 key={i} style={{ fontSize: '22px', fontWeight: 800, color: '#191c1d', margin: '0 0 16px' }}>
                    {line.slice(2)}
                </h1>
            );
        }
        // Titre H2
        if (line.startsWith('## ')) {
            return (
                <h2 key={i} style={{ fontSize: '16px', fontWeight: 700, color: '#191c1d', margin: '24px 0 8px' }}>
                    {line.slice(3)}
                </h2>
            );
        }
        // Titre H3
        if (line.startsWith('### ')) {
            return (
                <h3 key={i} style={{ fontSize: '14px', fontWeight: 700, color: '#414754', margin: '16px 0 6px' }}>
                    {line.slice(4)}
                </h3>
            );
        }
        // Séparateur
        if (line.trim() === '---') {
            return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(193,198,214,.4)', margin: '20px 0' }} />;
        }
        // Ligne vide
        if (line.trim() === '') {
            return <div key={i} style={{ height: '6px' }} />;
        }
        // Élément de liste
        if (line.startsWith('- ')) {
            return (
                <li key={i} style={{ fontSize: '14px', color: '#414754', lineHeight: 1.65, marginLeft: '18px', marginBottom: '4px' }}>
                    <InlineMarkdown text={line.slice(2)} />
                </li>
            );
        }
        // Paragraphe normal
        return (
            <p key={i} style={{ fontSize: '14px', color: '#414754', lineHeight: 1.65, margin: '0 0 6px' }}>
                <InlineMarkdown text={line} />
            </p>
        );
    });

    return <div>{elements}</div>;
};

// Gère le gras **texte** dans une ligne
const InlineMarkdown = ({ text }: { text: string }): ReactElement => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} style={{ color: '#191c1d' }}>{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
};
