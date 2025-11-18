import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Blog } from '@server/blog/blog.types';
import { GalleryStatus } from '@server/gallery/gallery.types';

import { ErrorMessage } from '@/components/Error';
import {
    useBlogAdd,
    useBlogDelete,
    useBlogUpdate,
    useBlogs,
} from '@/services/blog';
import { useSpinner } from '@/services/spinner';

export const AdminBlogHome = () => {
    const [show, setShow] = useState<'add' | 'edit' | 'delete' | undefined>(
        undefined,
    );
    const [selected, setSelected] = useState<Blog | undefined>();
    const [blogs, loading, error] = useBlogs(true, [show]);
    useSpinner('AdminBlogHome', loading);
    if (loading) return;
    if (error) return <ErrorMessage error={error} />;

    const handleOpen = (
        newShow: typeof show,
        newSelected?: typeof selected,
    ) => {
        setShow(newShow);
        setSelected(newSelected);
    };
    const handleClose = () => {
        setShow(undefined);
        setSelected(undefined);
    };

    return (
        <div className=" vertical max">
            {blogs?.map((blog) => (
                <article
                    key={blog.id}
                    className="center max padding"
                    style={{ maxWidth: '600px' }}
                >
                    <h3>{blog.title}</h3>
                    <p>{blog.content}</p>
                    <p className="right-align small-text">
                        Par {blog.author} le{' '}
                        {blog.createdAt.toLocaleDateString()}
                    </p>
                    <nav className="right-align">
                        <button
                            className="circle fill"
                            onClick={() => handleOpen('delete', blog)}
                        >
                            <i>delete</i>
                        </button>
                        <button
                            className="circle"
                            onClick={() => handleOpen('edit', blog)}
                        >
                            <i>edit</i>
                        </button>
                    </nav>
                </article>
            ))}
            <div className="large-space"></div>
            {/* Modal d'ajout */}
            {show === 'add' && (
                <dialog className="active">
                    <AdminBlogAddEdit
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {/* Modal d'édition */}
            {show === 'edit' && selected && (
                <dialog className="active">
                    <AdminBlogAddEdit
                        blog={selected}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {/* Modal de suppression */}
            {show === 'delete' && selected && (
                <dialog className="active">
                    <AdminBlogDelete
                        blog={selected}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {/* Bouton d'ajout */}
            <div className="fixed center bottom bottom-margin row">
                <button className="primary" onClick={() => handleOpen('add')}>
                    <i>add</i>
                    <span>Créer un article</span>
                </button>
            </div>
        </div>
    );
};

interface AdminBlogAddEditProps {
    blog?: Blog;
    onClose?: () => void;
    onSuccess?: () => void;
}
export const AdminBlogAddEdit = ({
    blog,
    onClose,
    onSuccess,
}: AdminBlogAddEditProps) => {
    const [add, addLoading, addError] = useBlogAdd();
    const [update, updateLoading, updateError] = useBlogUpdate();
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            title: blog?.title || '',
            content: blog?.content || '',
            author: blog?.author || 'APIC',
            status: blog?.status || GalleryStatus.DRAFT,
        },
    });
    const onSubmit = async (data: {
        title: string;
        content: string;
        author: string;
        status: GalleryStatus;
    }) => {
        if (blog?.id) {
            await update({
                ...data,
                id: blog.id,
            });
        } else {
            await add({
                title: data.title,
                content: data.content,
                author: data.author,
                status: data.status,
            });
        }
        reset();
        onSuccess?.();
        onClose?.();
    };

    const handleCancel = () => {
        reset();
        onClose?.();
    };

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="field label border">
                    <input
                        id="title"
                        type="text"
                        {...register('title', {
                            required: 'Le titre est obligatoire.',
                        })}
                        className={errors.title ? 'invalid' : ''}
                    />
                    <label>Titre</label>
                    <span className="error">{errors.title?.message}</span>
                </div>
                <div className="field textarea label border">
                    <textarea
                        id="content"
                        {...register('content', {
                            required: 'Le contenu est obligatoire.',
                        })}
                        className={errors.content ? 'invalid' : ''}
                    />
                    <label>Contenu</label>
                    <span className="error">{errors.content?.message}</span>
                </div>
                <div className="field label border">
                    <input
                        id="author"
                        type="text"
                        {...register('author', {
                            required: "L'auteur est obligatoire.",
                        })}
                        className={errors.author ? 'invalid' : ''}
                    />
                    <label>Auteur</label>
                    <span className="error">{errors.author?.message}</span>
                </div>
                <div className="field label border">
                    <select
                        id="status"
                        {...register('status', {
                            required: 'Le statut est obligatoire.',
                        })}
                        className={errors.status ? 'invalid' : ''}
                    >
                        <option value={GalleryStatus.DRAFT}>Brouillon</option>
                        <option value={GalleryStatus.PUBLISHED}>Publié</option>
                        <option value={GalleryStatus.ARCHIVED}>Archivé</option>
                    </select>
                    <label>Statut</label>
                    <span className="error">{errors.status?.message}</span>
                </div>
                <span className="error-text">
                    {addError?.message ?? updateError?.message}
                </span>
                <nav className="right-align">
                    <button
                        type="button"
                        className="border"
                        onClick={handleCancel}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={addLoading || updateLoading}
                        className="primary"
                    >
                        {blog?.id ? 'Mettre à jour' : 'Créer'}
                    </button>
                </nav>
            </form>
        </div>
    );
};

interface AdminBlogDeleteProps {
    blog: Blog;
    onClose?: () => void;
    onSuccess?: () => void;
}
export const AdminBlogDelete = ({
    blog,
    onClose,
    onSuccess,
}: AdminBlogDeleteProps) => {
    const [deleteBlog, loading, error] = useBlogDelete();

    const handleConfirmDelete = async () => {
        try {
            if (blog) {
                await deleteBlog(blog.id);
            }
            onSuccess?.();
            onClose?.();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };
    return (
        <div>
            <h5>Confirmer la suppression</h5>
            <p>
                Êtes-vous sûr de vouloir supprimer l'article{' '}
                <strong>"{blog.title}"</strong>?
            </p>
            <span className="error-text">{error?.message}</span>
            <nav className="right-align">
                <button className="border" onClick={onClose}>
                    Annuler
                </button>
                <button
                    className="error"
                    disabled={loading}
                    onClick={handleConfirmDelete}
                >
                    Supprimer
                </button>
            </nav>
        </div>
    );
};
