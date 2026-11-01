export default function Card({
    children,
    glass = false,
    className = '',
    as: Element = 'div',
    ...props
}) {
    const classes = `${glass ? 'glass' : 'aura-card'} ${className}`;

    return (
        <Element className={classes} {...props}>
            {children}
        </Element>
    );
}
