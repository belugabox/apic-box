import { ReactNode } from "react";

interface PageProps {
    loading?: boolean;
    error?: Error | null;
    spinner?: boolean;
    children: ReactNode;
}

export const Page = ({ loading, error, spinner = true, children }: PageProps) => {
    return (
        <>
            <div>
                {error && (
                    <article className="error-container">
                        <h5 className="small">Erreur</h5>
                        <p>{error.message}</p>
                    </article>
                )}
                {!error && !loading && (
                    <>{children}</>
                )}
            </div>
            {!error && loading && spinner && (
                <div className="shape loading-indicator absolute center middle  "></div>
            )}
        </>
    )
};