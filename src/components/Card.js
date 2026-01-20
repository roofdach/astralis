
const Card = ({ children }) => {
    return (
      <div className="max-w-4xl mx-auto">

        <div 
          className="rounded-xl p-8"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--card-foreground)'
          }}
        >
          {children}
        </div>
      </div>
    )
}

export default Card;