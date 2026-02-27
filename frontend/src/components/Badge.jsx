import styles from './Badge.module.css';

export default function Badge({
    children,
    color = 'mint', // mint, pink, blue
    className = '',
    ...props
}) {
    const classes = [
        styles.badge,
        styles[`badge-${color}`],
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
}
