import { Component, type ErrorInfo, type ReactNode } from "react";
import { tStatic } from "../i18n";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 gap-4">
          <h1 className="text-2xl font-bold">
            {tStatic("errorBoundary.title")}
          </h1>
          <p className="text-zinc-400">
            {tStatic("errorBoundary.description")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
            >
              {tStatic("errorBoundary.reload")}
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600"
            >
              {tStatic("errorBoundary.clearReload")}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
