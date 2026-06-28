import { Component } from "react";

// Shows a fallback instead of a blank page when a child render crashes.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Orate crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app">
          <section className="card center">
            <h2>Something went wrong</h2>
            <p className="muted">
              Orate hit an unexpected error. Reloading usually fixes it.
            </p>
            <div className="actions">
              <button onClick={() => window.location.reload()}>Reload</button>
            </div>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
