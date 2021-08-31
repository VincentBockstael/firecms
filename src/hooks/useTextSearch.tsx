import { useEffect, useState } from "react";
import { Entity, EntitySchema, TextSearchDelegate } from "../models";
import { useDataSource } from "./useDataSource";

/**
 * @category Hooks and utilities
 */
export interface TextSearchProps<M extends { [Key: string]: any }> {

    searchString?: string;

    textSearchDelegate?: TextSearchDelegate;

    path: string;

    schema: EntitySchema<M>;

}

/**
 * @category Hooks and utilities
 */
export type TextSearchResult<M extends { [Key: string]: any }> = {
    textSearchData: Entity<M>[]
    textSearchLoading: boolean,
}

/**
 *
 * @param searchString
 * @param textSearchDelegate
 * @param path
 * @param schema
 * @category Hooks and utilities
 */
export function useTextSearch<M extends { [Key: string]: any }>(
    {
        searchString,
        textSearchDelegate,
        path,
        schema
    }: TextSearchProps<M>): TextSearchResult<M> {


    const dataSource = useDataSource();
    const [textSearchLoading, setTextSearchLoading] = useState<boolean>(false);
    const [textSearchData, setTextSearchData] = useState<Entity<M>[]>([]);

    async function onTextSearch(searchString?: string) {
        if (textSearchDelegate) {
            setTextSearchLoading(true);
            if (!searchString) {
                setTextSearchData([]);
            } else {
                const ids = await textSearchDelegate.performTextSearch(searchString);
                const promises: Promise<Entity<M> | null>[] = ids
                    .map(async (entityId) => {
                            try {
                                return await dataSource.fetchEntity({
                                    path,
                                    entityId,
                                    schema
                                });
                            } catch (e) {
                                console.error(e);
                                return null;
                            }
                        }
                    );
                const entities = (await Promise.all(promises))
                    .filter((e) => e !== null && e.values) as Entity<M>[];
                setTextSearchData(entities);
            }
            setTextSearchLoading(false);
        }
    }

    useEffect(() => {

        if (searchString) {
            onTextSearch(searchString).then();
        } else {
            setTextSearchData([]);
            setTextSearchLoading(false);
        }

    }, [path, schema, textSearchDelegate, searchString]);

    return {
        textSearchData,
        textSearchLoading
    };

}
