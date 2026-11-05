export default function MultiSelect({ label, items, values, onChange, hint }) {
  return (
    <fieldset className="multi-select">
      <legend>{label} <span>от 1 и более</span></legend>
      {hint && <p>{hint}</p>}
      <div className="multi-select-options">
        {items.map(item => <label key={item.id} className={`selection-option ${values.includes(item.id) ? "selected" : ""}`}>
          <input type="checkbox" checked={values.includes(item.id)} onChange={() => onChange(values.includes(item.id) ? values.filter(id => id !== item.id) : [...values, item.id])} />
          <span>{item.name}</span>
        </label>)}
      </div>
      {!items.length && <p>Справочник пуст. Администратор должен добавить значения.</p>}
      <small>Выбрано: {values.length}</small>
    </fieldset>
  );
}
