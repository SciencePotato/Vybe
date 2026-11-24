import React from 'react';
import {
    DrawerContentScrollView,
    DrawerItemList,
  } from '@react-navigation/drawer';
  
export default function CustomDrawerContent(props: any) {
    const filteredRoutes = props.state.routes.filter(
            (route: any) => route.name !== '(auth)/Auth'
        );
        
        const filteredRouteKeys = new Set(filteredRoutes.map((r: any) => r.key));

        const filteredDescriptors = Object.fromEntries(
        Object.entries(props.descriptors).filter(([key]) =>
            filteredRouteKeys.has(key)
        )
        );

        const activeKey = props.state.routes[props.state.index]?.key;
        const filteredState = {
        ...props.state,
        routes: filteredRoutes,
        routeNames: filteredRoutes.map((r: any) => r.name),
        index: Math.max(0, filteredRoutes.findIndex((route: any) => route.key === activeKey)),
        };

        const filteredProps = {
        ...props,
        state: filteredState,
        descriptors: filteredDescriptors,
        };

    return (
      <DrawerContentScrollView {...filteredProps}>
        <DrawerItemList {...filteredProps} />
      </DrawerContentScrollView>
    );
}