import React from 'react';

type ContainerProps = {
    classname: string;
    children: React.ReactNode;
}

const Container = (props: ContainerProps) => {
    return (
        <div classname={`p-3 ${props.classname}`}>
            {props.children}
        </div>
    )
}

export default Container;