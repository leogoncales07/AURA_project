import styles from './Button.module.css';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    const classes = [
        styles.btn,
        styles[`btn-${variant}`],
        styles[`btn-${size}`],
        className
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}
