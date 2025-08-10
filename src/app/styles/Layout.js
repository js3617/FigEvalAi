import styled from "styled-components";

const Content = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 20px;
    gap: 20px;
`;

const RefContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 10px;
`;

const BtnWrap = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
`;

const BtnStartWrap = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
`;

const ColumnGap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: baseline;
`;

const RowGap = styled.div`
    display: flex;
    flex-direction: row;
    gap: 5px;
`;

const TextArea = styled.textarea`
    width: 100%;
    height: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    resize: none;
`;

const Input = styled.input`
    width: 100%;
    height: 40px;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
`;

export { Content, RefContent, BtnWrap, BtnStartWrap, ColumnGap, RowGap, TextArea, Input };