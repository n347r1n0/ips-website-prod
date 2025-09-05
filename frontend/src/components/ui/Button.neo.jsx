export default function ButtonNeo({
  label,
  hoverLabel = label,
  className = '',
  style = {},
  ...props
}) {
  return (
    <button className={`btn-neo ${className}`} style={style} {...props}>
      <span className="wrap">
        <span className="label">
          <span>{label}</span>
          <span>{hoverLabel}</span>
        </span>
      </span>
    </button>
  );
}
