import React from 'react';

type InputProps = {
    type: 'text' | 'password' | 'number';
    value: string;
    name?: string;
}

const Input = (props: InputProps) => {
    return (
        <input type={props.type} value={props.value} name={props.name} />
    )
}

export default Input;