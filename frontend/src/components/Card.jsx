export default function Card({
    children,
    glass = false,
    className = '',
    ...props
}) {
    const classes = `${glass ? 'glass' : 'aura-card'} ${className}`;

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}
