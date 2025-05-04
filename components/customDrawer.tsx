import React, {useEffect} from 'react';
import {
    DrawerContentScrollView,
    DrawerItemList,
  } from '@react-navigation/drawer';
  
export default function CustomDrawerContent(props: any) {
    const [filteredProps, setFilteredProps] = React.useState(props);

    useEffect(() => {
        const filteredRoutes = props.state.routes.filter(
            (route: any) => route.name !== '(auth)/Auth'
        );
        
        const filteredRouteKeys = new Set(filteredRoutes.map((r: any) => r.key));

        const filteredDescriptors = Object.fromEntries(
        Object.entries(props.descriptors).filter(([key]) =>
            filteredRouteKeys.has(key)
        )
        );

        const filteredState = {
        ...props.state,
        routes: filteredRoutes,
        routeNames: filteredRoutes.map((r: any) => r.name),
        };

        setFilteredProps({
        ...props,
        state: filteredState,
        descriptors: filteredDescriptors,
        })
    }, []);

    return (
      <DrawerContentScrollView {...filteredProps}>
        <DrawerItemList {...filteredProps} />
      </DrawerContentScrollView>
    );
}