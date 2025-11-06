import { ReactNode } from "react";

interface PageProps {
    title: string;
    loading?: boolean;
    error?: Error | null;
    spinner?: boolean;
    children: ReactNode;
}

export const Page = ({ title, loading, error, spinner = true, children }: PageProps) => {
    return (
        <>
            <div className="page active">
                <h5>{title}</h5>
                <div className="small-padding"></div>
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
            </div >
            {!error && loading && spinner && (
                <div className="shape loading-indicator absolute center middle  "></div>
            )}</>
    )
};