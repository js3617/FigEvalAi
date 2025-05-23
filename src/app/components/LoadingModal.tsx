import React from 'react';
import Modal from 'react-modal';

import LoadingIcon from '../assets/LoadingIcon.svg';

interface Props {
    isOpen: boolean;
    closeModal?: () => void;
}


const LoadingModal = ({isOpen, closeModal}: Props) => {
    Modal.setAppElement('#react-page'); // 모달의 접근성 향상을 위한 설정, #root는 앱의 최상위 요소 ID입니다.

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            style={customStyles}
            ariaHideApp={false}
            contentLabel="LoadingEnd Modal"
            shouldCloseOnOverlayClick={false}>
            <img src={LoadingIcon} alt='Loading Icon' />
        </Modal>
    );
};

export default LoadingModal;

// 모달 스타일 정의
const customStyles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: 1000
    },
    content: {
        width: '300px',
        height: '200px',
        margin: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: 'transparent',
    }
};