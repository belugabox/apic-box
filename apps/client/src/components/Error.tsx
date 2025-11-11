export const ErrorMessage = ({ error }: { error: Error }) => {
    return (
        <div className="padding middle-align center-align">
            <div>
                <i className="extra">error</i>
                <h5>Erreur</h5>
                <p>{error.name}</p>
                <p>{error.message}</p>
            </div>
        </div>
    );
};
