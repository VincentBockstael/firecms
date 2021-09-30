import {
    DataSource,
    DeleteEntityProps,
    Entity,
    EntityOnDeleteProps,
    FireCMSContext
} from "../../models";

/**
 * @category Hooks and utilities
 */
export type DeleteEntityWithCallbacksProps<M> = DeleteEntityProps<M> & {
    onDeleteSuccess?: (entity: Entity<M>) => void;
    onDeleteFailure?: (entity: Entity<M>, e: Error) => void;
    onPreDeleteHookError?: (entity: Entity<M>, e: Error) => void;
    onDeleteSuccessHookError?: (entity: Entity<M>, e: Error) => void;
}

/**
 * This function is in charge of deleting an entity in the datasource.
 * It will run all the delete callbacks specified in the schema.
 * It is also possible to attach callbacks on save success or error, and callback
 * errors.
 *
 * If you just want to delete the data without running the `onPreDelete`,
 * and `onDelete` callbacks, you can use the `deleteEntity` method
 * in the datasource ({@link useDataSource}).
 *
 * @param dataSource
 * @param entity
 * @param schema
 * @param onDeleteSuccess
 * @param onDeleteFailure
 * @param onPreDeleteHookError
 * @param onDeleteSuccessHookError
 * @param context
 * @category Hooks and utilities
 */
export async function deleteEntityWithCallbacks<M>({
                                                       dataSource,
                                                       entity,
                                                       schema,
                                                       onDeleteSuccess,
                                                       onDeleteFailure,
                                                       onPreDeleteHookError,
                                                       onDeleteSuccessHookError,
                                                       context
                                                   }: DeleteEntityWithCallbacksProps<M> & {
                                                       dataSource: DataSource,
                                                       context: FireCMSContext
                                                   }
): Promise<boolean> {

    console.debug("Deleting entity", entity.path, entity.id);

    const entityDeleteProps: EntityOnDeleteProps<M> = {
        entity,
        schema,
        entityId: entity.id,
        path: entity.path,
        context
    };

    if (schema.onPreDelete) {
        try {
            await schema.onPreDelete(entityDeleteProps);
        } catch (e: any) {
            console.error(e);
            if (onPreDeleteHookError)
                onPreDeleteHookError(entity, e);
            return false;
        }
    }
    return dataSource.deleteEntity({
        entity,
        schema
    }).then(() => {
        onDeleteSuccess && onDeleteSuccess(entity);
        try {
            if (schema.onDelete) {
                schema.onDelete(entityDeleteProps);
            }
            return true;
        } catch (e: any) {
            if (onDeleteSuccessHookError)
                onDeleteSuccessHookError(entity, e);
            return false;
        }
    }).catch((e) => {
        if (onDeleteFailure) onDeleteFailure(entity, e);
        return false;
    });
}
