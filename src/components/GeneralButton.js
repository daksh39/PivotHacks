import './styles/GeneralButton.css';

function GeneralButton(props) {
    return (
        <button className={props.isOutline ? 'btn btn--outline' : 'btn'}
                style={{height: props.height, width: props.width}}
                onClick={() => props.handleClick()}>
            {props.text}
        </button>
    );
}

export default GeneralButton;
