import './styles/VerteHeader.css';
import VerteMark from './VerteMark';
import CloseButton from './CloseButton';
import { BRAND } from '../config';

/*
 * Brand header. `isSmall` is the popup-strip variant; the large one heads the
 * full listings panel.
 */
function VerteHeader(props) {
    const small = props.isSmall;

    return (
        <div className={small ? 'verte-header' : 'verte-header verte-header--large'}>
            <VerteMark height={small ? 18 : 30} />
            <span className="verte-wordmark">{BRAND.name}</span>
            <CloseButton topPos={small ? '16px' : '35px'} rightPos={small ? '16px' : '32px'} />
        </div>
    );
}

export default VerteHeader;
