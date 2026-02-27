export default function Card({
    children,
    glass = false,
    className = '',
    ...props
}) {
    const baseClasses = glass ? 'glass' : 'bg-surface shadow-md';
    const classes = `card ${baseClasses} ${className}`;

    return (
        <div className={classes} {...props} style={{
            backgroundColor: glass ? undefined : '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: glass ? undefined : '1px solid var(--color-border)',
            boxShadow: glass ? undefined : 'var(--shadow-md)',
            ...props.style
        }}>
            {children}
        </div>
    );
}
