import React from 'react';

type ButtonProps = {
    text: string;
    onSubmit: () => void;

}
const Button = (props: ButtonProps) => {
    return (
        <button onSubmit={props.onSubmit}>
            {props.text}
        </button>
    )
}

export default Button;