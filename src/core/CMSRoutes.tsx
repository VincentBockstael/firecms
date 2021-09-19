import React from "react";

import { Route, Routes, useLocation } from "react-router-dom";
import { CMSView, Navigation } from "../models";
import { addInitialSlash, buildCollectionUrl } from "./navigation";
import { EntityCollectionTable } from "./components/EntityCollectionTable";
import BreadcrumbUpdater from "./components/BreadcrumbUpdater";
import CMSHome from "./components/CMSHome";
import { useNavigation } from "../hooks";

/**
 * This component is in charge of taking a {@link Navigation} and rendering
 * all the related routes (entity collection root views, custom views
 * or the home route).
 *
 * @constructor
 * @category Core components
 */
export function CMSRoutes({ HomePage }: {
    /**
     * In case you need to override the home page
     */
    HomePage?: React.ComponentType;
}) {

    const location = useLocation();
    const navigation = useNavigation();
    if (!navigation)
        return <></>;

    /**
     * The location can be overridden if `base_location` is set in the
     * state field of the current location. This can happen if you open
     * a side entity, like `products`, from a different one, like `users`
     */
    const baseLocation = location.state && location.state["base_location"] ? location.state["base_location"] : location;

    const customRoutes: JSX.Element[] = [];
    if (navigation.views) {
        const buildCMSViewRoute = (path: string, cmsView: CMSView) => {
            return <Route
                key={"navigation_view_" + path}
                path={addInitialSlash(path)}
                element={
                    <BreadcrumbUpdater
                        path={addInitialSlash(path)}
                        key={`navigation_${path}`}
                        title={cmsView.name}>
                        {cmsView.view}
                    </BreadcrumbUpdater>}
            />;
        };

        navigation.views.forEach((cmsView) => {
            if (Array.isArray(cmsView.path))
                customRoutes.push(...cmsView.path.map(path => buildCMSViewRoute(path, cmsView)));
            else
                customRoutes.push(buildCMSViewRoute(cmsView.path, cmsView));
        });
    }

    const collectionRoutes = [...navigation.collections]
        // we reorder collections so that nested paths are included first
        .sort((a, b) => b.relativePath.length - a.relativePath.length)
        .map(entityCollection => {
                const urlPath = buildCollectionUrl(entityCollection.relativePath);
                return (
                    <Route path={urlPath}
                           element={
                               <BreadcrumbUpdater
                                   path={urlPath}
                                   key={`navigation_${entityCollection.relativePath}`}
                                   title={entityCollection.name}>
                                   <EntityCollectionTable
                                       path={entityCollection.relativePath}
                                       collection={entityCollection}/>
                               </BreadcrumbUpdater>
                           }/>
                );
            }
        );

    const homeRoute =
        <Route path={"/"}
               element={
                   <BreadcrumbUpdater
                       path={"/"}
                       key={`navigation_home`}
                       title={"Home"}>
                       {HomePage ? <HomePage/> : <CMSHome/>}
                   </BreadcrumbUpdater>
               }/>;

    return (
        <Routes location={baseLocation}>

            {collectionRoutes}

            {customRoutes}

            {homeRoute}

        </Routes>
    );
}