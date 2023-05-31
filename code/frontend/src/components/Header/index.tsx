import { FC } from 'react';
import { Image } from 'antd';

import styles from './index.module.css';

const Header: FC<any> = ({ title }) => {
    return (
        <div className={styles.title}>{title}</div>
    );
};

export default Header;
